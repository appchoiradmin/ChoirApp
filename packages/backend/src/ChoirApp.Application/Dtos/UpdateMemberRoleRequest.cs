using System.ComponentModel.DataAnnotations;

namespace ChoirApp.Application.Dtos;

public class UpdateMemberRoleRequest
{
    [Required]
    public string Role { get; set; } = default!;
}
