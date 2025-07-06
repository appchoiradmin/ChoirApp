using System;
using System.Collections.Generic;

namespace ChoirApp.Application.Dtos
{
    public class UpdatePlaylistTemplateDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public List<string>? Sections { get; set; }
    }
}
