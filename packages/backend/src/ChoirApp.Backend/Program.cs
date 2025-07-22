using ChoirApp.Application;
using ChoirApp.Infrastructure;
using FastEndpoints;
using ChoirApp.Backend.Middleware;
using ChoirApp.Backend.Extensions;
using System.Globalization;
using Microsoft.Extensions.Localization;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = Directory.GetCurrentDirectory()
});

// Add services to the container.
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services
    .AddApplicationServices()
    .AddInfrastructureServices(builder.Configuration, builder.Environment);

builder.Services.AddFastEndpoints();

// Add localization services
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");
builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    var supportedCultures = new[] { "en", "es" };
    options.SetDefaultCulture("en")
           .AddSupportedCultures(supportedCultures)
           .AddSupportedUICultures(supportedCultures);
    
    // Use Accept-Language header to determine culture
    options.RequestCultureProviders.Clear();
    options.RequestCultureProviders.Add(new Microsoft.AspNetCore.Localization.AcceptLanguageHeaderRequestCultureProvider());
});

// Add controller support for OAuth endpoints
builder.Services.AddControllers();

// Configure authentication
builder.Services.AddAuth(builder.Configuration, builder.Environment);

// Get CORS origins from configuration
var corsOrigins = builder.Configuration.GetSection("CorsOrigins").Get<string[]>() ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins(corsOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials()
                  .WithExposedHeaders("Location"); // Expose the Location header for CORS
        });

    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // app.UseSwaggerGen();
}

app.UseCors("AllowFrontend");

// Use request localization
app.UseRequestLocalization();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.UseFastEndpoints(c =>
{
    c.Endpoints.RoutePrefix = "api";
});

// Add controller routing
app.MapControllers();

app.Run();

public partial class Program { }
