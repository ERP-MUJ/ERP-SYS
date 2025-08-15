import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Auth, google } from 'googleapis';
import { config } from 'src/common/config';
import { UserRole } from '@repo/db/prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private oauth2Client: Auth.OAuth2Client;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.callbackUrl,
    );
  }

  async handleGoogleAuth(idToken: string) {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: config.google.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid google id token');
      }
      const { email, sub: googleId, given_name, family_name } = payload;
      if (!email) {
        throw new UnauthorizedException('Invalid google id token');
      }
      let user = await this.prismaService.user.findFirst({
        where: {
          user_email: email,
        },
      });
      if (!user) {
        user = await this.prismaService.user.create({
          data: {
            user_email: email,
            user_name: `${given_name} ${family_name}`,
            user_password: '', // Google auth users don't need password
            user_role: UserRole.FACULTY, // Default role for Google auth users
            dept_id: '', // This should be set based on business logic
          },
        });
      }
      const jwtPayload = {
        id: user.id,
        email: user.user_email,
        name: user.user_name,
        role: user.user_role,
        sub: googleId,
      };

      const token = await this.jwtService.signAsync(jwtPayload, {
        expiresIn: config.jwt.expiresIn,
      });
      return {
        token,
        user: {
          id: user.id,
          email: user.user_email,
          name: user.user_name,
          role: user.user_role,
        },
      };
    } catch (error) {
      this.logger.error(`error occured while verifying google id token: ${idToken}, ${error}`);
      throw new UnauthorizedException('Invalid google id token');
    }
  }

  async loginWithPassword(email: string, password: string, expectedRole?: string) {
    this.logger.log(`[loginWithPassword] Attempting login for email: ${email}`);
    // Find user by email
    const user = await this.prismaService.user.findFirst({
      where: { user_email: email },
    });
    if (!user) {
      this.logger.warn(`[loginWithPassword] No user found for email: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }
    // Compare password
    const isMatch = await bcrypt.compare(password, user.user_password);
    this.logger.log(`[loginWithPassword] Password match for email ${email}: ${isMatch}`);
    if (!isMatch) {
      this.logger.warn(`[loginWithPassword] Password mismatch for email: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }
    // Validate role if expectedRole is provided.
    // Special case: allow KPI_COORDINATORs to authenticate when frontend expects FACULTY
    // so they can reuse the same faculty dashboard without changing schema/flows.
    if (expectedRole) {
      const acceptableRoles = [expectedRole];
      if (expectedRole === UserRole.FACULTY) {
        acceptableRoles.push(UserRole.KPI_COORDINATOR as unknown as string);
      }
      if (!acceptableRoles.includes(user.user_role)) {
        this.logger.warn(
          `[loginWithPassword] Role mismatch for email: ${email}. Expected any of: ${acceptableRoles.join(', ')}, Found: ${user.user_role}`,
        );
        throw new UnauthorizedException(
          `Access denied. Expected role: ${expectedRole}, but user has role: ${user.user_role}`,
        );
      }
    }
    // Generate JWT
    const jwtPayload = {
      id: user.id,
      email: user.user_email,
      name: user.user_name,
      role: user.user_role,
      sub: user.id,
    };
    const token = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: config.jwt.expiresIn,
    });
    this.logger.log(`[loginWithPassword] Login successful for email: ${email}`);
    return {
      token,
      user: {
        id: user.id,
        email: user.user_email,
        name: user.user_name,
        role: user.user_role,
      },
    };
  }

  private getDefaultRole(email: string): UserRole {
    // Map specific admin emails to roles
    const roleMapping = {
      'qac@admin.com': UserRole.QAC,
      'hod@admin.com': UserRole.HOD,
      'faculty@admin.com': UserRole.FACULTY,
    };
    return roleMapping[email as keyof typeof roleMapping] || UserRole.FACULTY;
  }
}
