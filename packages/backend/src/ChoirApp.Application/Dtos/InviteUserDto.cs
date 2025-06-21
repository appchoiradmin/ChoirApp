using System.ComponentModel.DataAnnotations;

namespace ChoirApp.Application.Dtos
{
    public class InviteUserDto
    {
        [Required]
        public Guid ChoirId { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}
