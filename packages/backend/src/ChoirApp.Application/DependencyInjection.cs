using ChoirApp.Application.Contracts;
using ChoirApp.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace ChoirApp.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Register Application layer services (business logic)
        services.AddScoped<IChoirService, ChoirService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ISongService, SongService>();
        services.AddScoped<IInvitationService, InvitationService>();
        services.AddScoped<IPlaylistService, PlaylistService>();
        
        return services;
    }
}
