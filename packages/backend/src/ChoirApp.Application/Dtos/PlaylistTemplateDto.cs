using System;
using System.Collections.Generic;

namespace ChoirApp.Application.Dtos
{
    public class PlaylistTemplateDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid ChoirId { get; set; }
        public bool IsDefault { get; set; }
        public List<PlaylistTemplateSectionDto> Sections { get; set; } = new List<PlaylistTemplateSectionDto>();
    }

    public class PlaylistTemplateSectionDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Order { get; set; }
        public List<PlaylistSongDto> Songs { get; set; } = new List<PlaylistSongDto>();
    }
}
