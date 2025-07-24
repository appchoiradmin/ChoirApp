using System.ComponentModel.DataAnnotations;

namespace ChoirApp.Application.Dtos
{
    public class AcceptShareableInvitationDto
    {
        [Required]
        public string InvitationToken { get; set; } = string.Empty;
    }
}
