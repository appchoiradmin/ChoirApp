using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
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
        Get("/me");
        Roles("General", "ChoirAdmin", "SuperAdmin");
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
            Choirs = user.UserChoirs
                .Where(uc => uc.Choir != null)
                .Select(uc => new ChoirDto
            {
                Id = uc.Choir!.ChoirId,
                Name = uc.Choir.ChoirName,
                AdminId = uc.Choir.AdminUserId
            }).ToList()
        };

        await SendOkAsync(userDto, ct);
    }
}
