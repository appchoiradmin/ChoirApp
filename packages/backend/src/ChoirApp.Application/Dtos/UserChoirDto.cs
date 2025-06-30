using System;

namespace ChoirApp.Application.Dtos
{
    public class UserChoirDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
