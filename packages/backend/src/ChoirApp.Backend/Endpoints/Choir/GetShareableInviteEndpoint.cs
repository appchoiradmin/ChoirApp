using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Choir
{
    public class GetShareableInviteRequest
    {
        public string Token { get; set; } = string.Empty;
    }

    public class GetShareableInviteEndpoint : Endpoint<GetShareableInviteRequest, ShareableInvitationDto>
    {
        private readonly IInvitationService _invitationService;

        public GetShareableInviteEndpoint(IInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        public override void Configure()
        {
            Verbs("GET", "OPTIONS");
            Routes("/invitations/shareable/{token}");
            AllowAnonymous();
        }

        public override async Task HandleAsync(GetShareableInviteRequest req, CancellationToken ct)
        {
            var result = await _invitationService.GetShareableInvitationByTokenAsync(req.Token);

            if (result.IsFailed)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            await SendOkAsync(result.Value, ct);
        }
    }
}
