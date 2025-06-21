using FastEndpoints;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;

namespace ChoirApp.Backend.Endpoints.Auth
{
    public class SignInGoogleEndpoint : EndpointWithoutRequest
    {
        public override void Configure()
        {
            Get("/auth/signin-google");
            AllowAnonymous();
        }

        public override async Task HandleAsync(CancellationToken ct)
        {
            var properties = new AuthenticationProperties { RedirectUri = "/api/auth/google-callback" };
            await HttpContext.ChallengeAsync(GoogleDefaults.AuthenticationScheme, properties);
        }
    }
}
