using System;
using System.Collections.Generic;

namespace ChoirApp.Application.Dtos;

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string Role { get; set; } = string.Empty;
    public List<UserChoirDto> Choirs { get; set; } = new();
    public bool HasCompletedOnboarding { get; set; }
    public bool IsNewUser { get; set; }
}
