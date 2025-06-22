using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using Microsoft.AspNetCore.Authentication;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Auth
{
    public class GoogleCallbackEndpoint : EndpointWithoutRequest<AuthResponse>
    {
        private readonly IUserService _userService;
        private readonly ITokenService _tokenService;

        public GoogleCallbackEndpoint(IUserService userService, ITokenService tokenService)
        {
            _userService = userService;
            _tokenService = tokenService;
        }

        public override void Configure()
        {
            Get("/auth/google-callback");
            AllowAnonymous();
        }

        public override async Task HandleAsync(CancellationToken ct)
        {
            var authenticateResult = await HttpContext.AuthenticateAsync();

            if (!authenticateResult.Succeeded)
            {
                await SendUnauthorizedAsync(ct);
                return;
            }

            var claims = authenticateResult.Principal.Claims;
            var googleId = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;

            if (string.IsNullOrEmpty(googleId) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(name))
            {
                ThrowError("Could not retrieve user information from Google.");
                return;
            }

            var result = await _userService.FindOrCreateUserAsync(googleId, name, email);
            if(result.IsFailed)
            {
                ThrowError(result.Errors.First().Message);
                return;
            }

            var user = result.Value;
            var token = _tokenService.CreateToken(user);

            var frontendUrl = "http://localhost:5173"; // This should be read from configuration
                        HttpContext.Response.Redirect($"{frontendUrl}/auth/callback?token={token}", permanent: false, preserveMethod: false);
        }
    }
}
