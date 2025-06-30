using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Choir
{
    public class GetChoirInvitationsEndpoint : Endpoint<GetChoirInvitationsRequest, List<InvitationDto>>
    {
        private readonly IInvitationService _invitationService;

        public GetChoirInvitationsEndpoint(IInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        public override void Configure()
        {
            Verbs("GET");
            Routes("/choirs/{ChoirId}/invitations");
            AuthSchemes("Bearer");
            Roles("ChoirAdmin", "SuperAdmin");
        }

        public override async Task HandleAsync(GetChoirInvitationsRequest req, CancellationToken ct)
        {
            req.ChoirId = Route<Guid>("ChoirId");
            var invitations = await _invitationService.GetInvitationsByChoirAsync(req.ChoirId);
            await SendOkAsync(invitations, ct);
        }
    }

    public class GetChoirInvitationsRequest
    {
        public Guid ChoirId { get; set; }
    }
}
