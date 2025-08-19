using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using System;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Choir
{
    public class GetChoirEndpoint : Endpoint<GetChoirRequest, ChoirDto>
    {
        private readonly IChoirService _choirService;

        public GetChoirEndpoint(IChoirService choirService)
        {
            _choirService = choirService;
        }

        public override void Configure()
        {
            Get("/choirs/{ChoirId}");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.GeneralUser), nameof(UserRole.ChoirMember), nameof(UserRole.ChoirAdmin));
        }

        public override async Task HandleAsync(GetChoirRequest req, CancellationToken ct)
        {
            var result = await _choirService.GetChoirByIdAsync(req.ChoirId);

            if (result.IsFailed)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            var choir = result.Value;
            var response = new ChoirDto
            {
                Id = choir.ChoirId,
                Name = choir.ChoirName,
                Address = choir.Address,
                Notes = choir.Notes,
                AdminId = choir.AdminUserId,
                Members = choir.UserChoirs.Select(uc => new ChoirMemberDto
                {
                    Id = uc.UserId,
                    Name = uc.User!.Name,
                    Email = uc.User!.Email,
                    Role = uc.IsAdmin ? nameof(UserRole.ChoirAdmin) : nameof(UserRole.ChoirMember)
                }).ToList()
            };

            await SendAsync(response, cancellation: ct);
        }
    }

    public class GetChoirRequest
    {
        public Guid ChoirId { get; set; }
    }
}
