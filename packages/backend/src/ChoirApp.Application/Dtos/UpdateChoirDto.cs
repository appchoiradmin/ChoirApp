using System.ComponentModel.DataAnnotations;

namespace ChoirApp.Application.Dtos
{
    public class UpdateChoirDto
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Address { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }
    }
}
