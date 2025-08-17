using System;

namespace ChoirApp.Application.Dtos
{
    public class InvitationDto
    {
        public required string InvitationToken { get; set; }
        public Guid ChoirId { get; set; }
        public required string ChoirName { get; set; }
        public required string Email { get; set; }
        public required string Status { get; set; }
        public DateTimeOffset SentAt { get; set; }
    }
}
