using ChoirApp.Application.Contracts;
using ChoirApp.Application.Services;
using ChoirApp.Domain.Services;
using ChoirApp.Infrastructure.Persistence;
using ChoirApp.Infrastructure.Repositories;
using ChoirApp.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace ChoirApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        if (!environment.IsEnvironment("Testing"))
        {
            services.AddDbContext<ApplicationDbContext>(
                options => options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
                    .EnableSensitiveDataLogging(environment.IsDevelopment())
                    .LogTo(Console.WriteLine, Microsoft.Extensions.Logging.LogLevel.Information)
                    .EnableDetailedErrors(environment.IsDevelopment())
            );
        }

        // Add in-memory caching
        services.AddMemoryCache();

        // Register Infrastructure-specific services (external concerns)
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IChoirUniquenessChecker, ChoirUniquenessChecker>();
        
        // Register Repository implementations (data access)
        services.AddScoped<IChoirRepository, ChoirRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ISongRepository, SongRepository>();
        services.AddScoped<IPlaylistRepository, PlaylistRepository>();
        services.AddScoped<IPlaylistTemplateRepository, PlaylistTemplateRepository>();
        services.AddScoped<IGlobalPlaylistTemplateRepository, GlobalPlaylistTemplateRepository>();
        services.AddScoped<IInvitationRepository, InvitationRepository>();
        services.AddScoped<IShareableInvitationRepository, ShareableInvitationRepository>();
        services.AddScoped<ITagRepository, TagRepository>();
        services.AddScoped<IInvitationPolicy, InvitationPolicy>();
        services.AddScoped<IPdfGenerationService, PdfGenerationService>();
        services.AddScoped<IPushSubscriptionRepository, PushSubscriptionRepository>();
        services.AddScoped<IPushNotificationProvider, WebPushNotificationProvider>();

        return services;
    }   
}
