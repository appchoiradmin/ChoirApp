using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Services;
using ChoirApp.Infrastructure.Persistence;
using ChoirApp.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ChoirApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(
            options => options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
        );

        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IMasterSongService, MasterSongService>();
        services.AddScoped<IChoirSongService, ChoirSongService>();
        services.AddScoped<IChoirService, ChoirService>();
        services.AddScoped<IInvitationService, InvitationService>();
        services.AddScoped<IChoirUniquenessChecker, ChoirUniquenessChecker>();
        services.AddScoped<IInvitationPolicy, InvitationPolicy>();

        return services;
    }
}
