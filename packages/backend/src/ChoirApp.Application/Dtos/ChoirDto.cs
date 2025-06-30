using System;
using System.Collections.Generic;

namespace ChoirApp.Application.Dtos
{
    public class ChoirDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid AdminId { get; set; }
        public List<ChoirMemberDto> Members { get; set; } = new();
    }

    public class ChoirMemberDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
