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
            
            var claims = new List<Claim>();
            foreach (var claim in jsonToken.Claims)
            {
                // Map JWT role claims to the standard ClaimTypes.Role
                if (claim.Type == "role")
                {
                    claims.Add(new Claim(ClaimTypes.Role, claim.Value));
                    Logger.LogInformation($"Adding role claim: {ClaimTypes.Role} = {claim.Value}");
                }
                // Map JWT nameid claims to the standard ClaimTypes.NameIdentifier
                else if (claim.Type == "nameid")
                {
                    claims.Add(new Claim(ClaimTypes.NameIdentifier, claim.Value));
                    Logger.LogInformation($"Adding name identifier claim: {ClaimTypes.NameIdentifier} = {claim.Value}");
                }
                else
                {
                    claims.Add(new Claim(claim.Type, claim.Value));
                    Logger.LogInformation($"Adding claim: {claim.Type} = {claim.Value}");
                }
            }

            var identity = new ClaimsIdentity(claims, Scheme.Name);
            identity.AddClaim(new Claim(ClaimTypes.AuthenticationMethod, Scheme.Name));
            
            Logger.LogInformation($"Identity authenticated: {identity.IsAuthenticated}");
            Logger.LogInformation($"Identity name: {identity.Name}");
            Logger.LogInformation($"Identity roles: {string.Join(", ", identity.FindAll(ClaimTypes.Role).Select(c => c.Value))}");
            
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, Scheme.Name);

            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }
}
