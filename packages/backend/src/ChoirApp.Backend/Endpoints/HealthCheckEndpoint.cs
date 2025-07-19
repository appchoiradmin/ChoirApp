using FastEndpoints;

namespace ChoirApp.Backend.Endpoints
{
    public class HealthCheckEndpoint : EndpointWithoutRequest<HealthCheckResponse>
    {
        public override void Configure()
        {
            Get("/health");
            AllowAnonymous();
        }

        public override async Task HandleAsync(CancellationToken ct)
        {
            var response = new HealthCheckResponse
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                Version = "1.0.0"
            };

            await SendOkAsync(response, ct);
        }
    }

    public class HealthCheckResponse
    {
        public string Status { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Version { get; set; } = string.Empty;
    }
}
