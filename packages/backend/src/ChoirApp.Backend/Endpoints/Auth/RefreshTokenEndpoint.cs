using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Auth
{
    public class RefreshTokenRequest
    {
        // FastEndpoints requires at least one public property
        // This is a dummy property that won't be used
        public string? RequestId { get; set; }
    }

    public class RefreshTokenResponse
    {
        public string Token { get; set; } = string.Empty;
    }

    public class RefreshTokenEndpoint : Endpoint<RefreshTokenRequest, RefreshTokenResponse>
    {
        private readonly ITokenService _tokenService;
        private readonly ILogger<RefreshTokenEndpoint> _logger;

        public RefreshTokenEndpoint(ITokenService tokenService, ILogger<RefreshTokenEndpoint> logger)
        {
            _tokenService = tokenService;
            _logger = logger;
        }

        public override void Configure()
        {
            Verbs("POST");
            Routes("/auth/refresh-token");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
        }

        public override async Task HandleAsync(RefreshTokenRequest req, CancellationToken ct)
        {
            try
            {
                _logger.LogInformation("Starting token refresh process");
                
                // Log all claims for debugging
                foreach (var claim in User.Claims)
                {
                    _logger.LogInformation("Claim: {Type} = {Value}", claim.Type, claim.Value);
                }
                
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                if (userIdClaim == null)
                {
                    _logger.LogWarning("NameIdentifier claim not found. Trying 'nameid' claim");
                    userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "nameid")?.Value;
                }
                
                _logger.LogInformation("User ID from claim: {UserId}", userIdClaim);
                
                if (!Guid.TryParse(userIdClaim, out var userId))
                {
                    _logger.LogError("Failed to parse user ID: {UserId}", userIdClaim);
                    ThrowError("User not authenticated properly.");
                    return;
                }
                
                _logger.LogInformation("Calling TokenService.RefreshTokenAsync for user {UserId}", userId);
                var result = await _tokenService.RefreshTokenAsync(userId);

                if (result.IsFailed)
                {
                    _logger.LogError("Token refresh failed: {ErrorMessage}", result.Errors.First().Message);
                    AddError(result.Errors.First().Message);
                    await SendErrorsAsync(cancellation: ct);
                    return;
                }

                _logger.LogInformation("Token refresh successful");
                var response = new RefreshTokenResponse
                {
                    Token = result.Value
                };

                await SendAsync(response, cancellation: ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception during token refresh");
                ThrowError("An unexpected error occurred during token refresh.");
            }
        }
    }
}
