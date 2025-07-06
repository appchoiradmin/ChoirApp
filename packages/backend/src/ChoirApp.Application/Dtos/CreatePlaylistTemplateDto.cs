using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ChoirApp.Application.Dtos
{
    public class CreatePlaylistTemplateDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid ChoirId { get; set; }
        public List<string> Sections { get; set; } = new List<string>();
    }
}
