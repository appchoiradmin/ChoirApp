using System;

namespace ChoirApp.Application.Dtos
{
    public class ChoirDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid AdminId { get; set; }
    }
}
