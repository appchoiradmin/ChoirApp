using System.ComponentModel.DataAnnotations;

namespace ChoirApp.Application.Dtos
{
    public class CreateChoirDto
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Name { get; set; } = string.Empty;
    }
}
