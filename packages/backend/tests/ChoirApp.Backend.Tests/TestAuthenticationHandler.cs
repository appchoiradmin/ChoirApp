using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Tests
{
    public class TestAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public TestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger, UrlEncoder encoder)
            : base(options, logger, encoder)
        {
        }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            // This handler has two modes:
            // 1. Simulate Google OAuth callback for the signin-success endpoint test.
            // 2. Authenticate using a Bearer token for other protected endpoints.

            // Mode 1: Simulate Google Callback
            if (Request.Headers.ContainsKey("X-Test-Auth-Mode") && Request.Headers["X-Test-Auth-Mode"] == "GoogleCallback")
            {
                // Allow tests to specify custom Google ID via header
                var googleId = Request.Headers.ContainsKey("X-Test-Google-Id") 
                    ? Request.Headers["X-Test-Google-Id"].ToString()
                    : "google-test-id";
                    
                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, googleId),
                    new Claim(ClaimTypes.Email, "test.user@gmail.com"),
                    new Claim(ClaimTypes.Name, "Test User")
                };
                var identity = new ClaimsIdentity(claims, "TestGoogle");
                var principal = new ClaimsPrincipal(identity);
                var ticket = new AuthenticationTicket(principal, "TestGoogle"); // Use a distinct scheme
                Logger.LogInformation("Simulating Google OAuth callback success.");
                return Task.FromResult(AuthenticateResult.Success(ticket));
            }

            // Mode 2: Bearer Token Authentication
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return Task.FromResult(AuthenticateResult.NoResult());
            }

            var token = authHeader.Substring("Bearer ".Length).Trim();
            var tokenHandler = new JwtSecurityTokenHandler();

            if (!tokenHandler.CanReadToken(token))
            {
                return Task.FromResult(AuthenticateResult.Fail("Invalid token"));
            }

            var jsonToken = tokenHandler.ReadJwtToken(token);

            var claimsList = new List<Claim>();
            foreach (var claim in jsonToken.Claims)
            {
                if (claim.Type == "role")
                {
                    claimsList.Add(new Claim(ClaimTypes.Role, claim.Value));
                }
                else if (claim.Type == "nameid")
                {
                    claimsList.Add(new Claim(ClaimTypes.NameIdentifier, claim.Value));
                }
                else
                {
                    claimsList.Add(new Claim(claim.Type, claim.Value));
                }
            }

            var identityBearer = new ClaimsIdentity(claimsList, Scheme.Name);
            var principalBearer = new ClaimsPrincipal(identityBearer);
            var ticketBearer = new AuthenticationTicket(principalBearer, Scheme.Name);

            return Task.FromResult(AuthenticateResult.Success(ticketBearer));
        }
    }
}
