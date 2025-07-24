using FastEndpoints;

namespace ChoirApp.Backend.Endpoints;

public class TestRequest
{
    public string Message { get; set; } = string.Empty;
}

public class TestResponse
{
    public string Result { get; set; } = string.Empty;
}

public class TestEndpoint : Endpoint<TestRequest, TestResponse>
{
    public override void Configure()
    {
        Verbs("POST");
        Routes("/test");
        AllowAnonymous();
    }

    public override async Task HandleAsync(TestRequest req, CancellationToken ct)
    {
        Console.WriteLine("🔥 TEST ENDPOINT CALLED!");
        Console.WriteLine($"🔥 Request: {System.Text.Json.JsonSerializer.Serialize(req)}");
        
        await SendOkAsync(new TestResponse 
        { 
            Result = "Hello World from FastEndpoints!" 
        }, ct);
    }
}
