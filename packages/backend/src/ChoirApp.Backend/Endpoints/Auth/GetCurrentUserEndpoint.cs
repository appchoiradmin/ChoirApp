using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using ChoirApp.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ChoirApp.Backend.Endpoints.Auth;

public class GetCurrentUserEndpoint : EndpointWithoutRequest<UserDto>
{
    private readonly IUserService _userService;

    public GetCurrentUserEndpoint(IUserService userService)
    {
        _userService = userService;
    }

    public override void Configure()
    {
        Verbs("GET", "OPTIONS");
        Routes("/me");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            ThrowError("User not authenticated properly.");
            return;
        }

        var result = await _userService.GetUserByIdAsync(userId);

        if (result.IsFailed)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        var user = result.Value;
        var nameParts = user.Name.Split(' ', 2);

        var userDto = new UserDto
        {
            Id = user.UserId,
            Email = user.Email,
            FirstName = nameParts.Length > 0 ? nameParts[0] : string.Empty,
            LastName = nameParts.Length > 1 ? nameParts[1] : string.Empty,
            HasCompletedOnboarding = user.HasCompletedOnboarding,
            IsNewUser = user.IsNewUser(),
            Role = user.Role.ToString(),
            Choirs = user.UserChoirs
                .Where(uc => uc.Choir != null)
                .Select(uc => new UserChoirDto
                {
                    Id = uc.Choir!.ChoirId,
                    Name = uc.Choir.ChoirName,
                    Role = uc.IsAdmin ? nameof(UserRole.ChoirAdmin) : nameof(UserRole.ChoirMember)
                }).ToList()
        };

        await SendOkAsync(userDto, ct);
    }
}
