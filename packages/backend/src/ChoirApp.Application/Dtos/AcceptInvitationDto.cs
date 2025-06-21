using System.ComponentModel.DataAnnotations;

namespace ChoirApp.Application.Dtos
{
    public class AcceptInvitationDto
    {
        [Required]
        public string InvitationToken { get; set; } = string.Empty;
    }
}
