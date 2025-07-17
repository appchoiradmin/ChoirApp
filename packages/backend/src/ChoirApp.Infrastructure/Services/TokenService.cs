using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using FluentResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace ChoirApp.Infrastructure.Services
{
    public class TokenService : ITokenService
    {
        private readonly SymmetricSecurityKey _key;
        private readonly string _issuer;
        private readonly string _audience;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TokenService> _logger;

        public TokenService(IConfiguration config, ApplicationDbContext context, ILogger<TokenService> logger)
        {
            var issuer = config["Jwt:Issuer"];
            var audience = config["Jwt:Audience"];
            var key = config["Jwt:Key"];

            if (string.IsNullOrEmpty(issuer) || string.IsNullOrEmpty(audience) || string.IsNullOrEmpty(key))
            {
                throw new InvalidOperationException("JWT Issuer, Audience or Key is not configured.");
            }
            
            _issuer = issuer;
            _audience = audience;
            _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            _context = context;
            _logger = logger;
        }

        public string CreateToken(User user)
        {
            // Determine the highest role the user has
            var effectiveRole = DetermineEffectiveRole(user);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.NameId, user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("role", effectiveRole.ToString())
            };

            var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddDays(7),
                SigningCredentials = creds,
                Issuer = _issuer,
                Audience = _audience
            };

            var tokenHandler = new JwtSecurityTokenHandler();

            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        private UserRole DetermineEffectiveRole(User user)
        {
            try
            {
                _logger.LogInformation("Determining effective role for user {UserId}", user.UserId);
                
                // Check if the user is an admin of any choir
                var isChoirAdmin = _context.UserChoirs
                    .Any(uc => uc.UserId == user.UserId && uc.IsAdmin);
                
                _logger.LogInformation("User {UserId} is choir admin: {IsAdmin}", user.UserId, isChoirAdmin);
                
                // If the user is a choir admin, return ChoirAdmin role regardless of their base role
                if (isChoirAdmin)
                {
                    _logger.LogInformation("Assigning ChoirAdmin role to user {UserId}", user.UserId);
                    return UserRole.ChoirAdmin;
                }
                
                // Otherwise, return their base role
                _logger.LogInformation("Using base role {Role} for user {UserId}", user.Role, user.UserId);
                return user.Role;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error determining effective role for user {UserId}", user.UserId);
                // Fall back to the user's base role in case of error
                return user.Role;
            }
        }

        public async Task<Result<string>> RefreshTokenAsync(Guid userId)
        {
            try
            {
                _logger.LogInformation("Refreshing token for user {UserId}", userId);
                
                // Find the user in the database with related choir information
                _logger.LogInformation("Querying database for user {UserId}", userId);
                var user = await _context.Users
                    .Include(u => u.UserChoirs)
                    .FirstOrDefaultAsync(u => u.UserId == userId);
                
                if (user == null)
                {
                    _logger.LogWarning("User with ID {UserId} not found", userId);
                    return Result.Fail($"User with ID {userId} not found.");
                }
                
                _logger.LogInformation("User {UserId} found, generating new token", userId);
                
                // Generate a new token with the user's current effective role
                var token = CreateToken(user);
                _logger.LogInformation("Token successfully generated for user {UserId}", userId);
                return Result.Ok(token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing token for user {UserId}", userId);
                return Result.Fail($"An error occurred while refreshing the token: {ex.Message}");
            }
        }
    }
}
