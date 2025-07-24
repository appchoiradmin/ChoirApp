using System;

namespace ChoirApp.Application.Dtos
{
    public class ShareableInvitationDto
    {
        public Guid InvitationId { get; set; }
        public Guid ChoirId { get; set; }
        public string InvitationToken { get; set; } = string.Empty;
        public Guid CreatedBy { get; set; }
        public DateTimeOffset DateCreated { get; set; }
        public DateTimeOffset? ExpiryDate { get; set; }
        public bool IsActive { get; set; }
        public int? MaxUses { get; set; }
        public int CurrentUses { get; set; }
        public string InvitationUrl { get; set; } = string.Empty;
    }
}
