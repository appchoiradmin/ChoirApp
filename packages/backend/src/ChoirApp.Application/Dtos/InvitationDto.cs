using System;

namespace ChoirApp.Application.Dtos
{
    public class InvitationDto
    {
        public string InvitationToken { get; set; }
        public Guid ChoirId { get; set; }
        public string ChoirName { get; set; }
        public string Email { get; set; }
        public string Status { get; set; }
        public DateTimeOffset SentAt { get; set; }
    }
}
