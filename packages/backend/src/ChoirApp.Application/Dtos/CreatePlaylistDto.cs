using System;
using System.Collections.Generic;

namespace ChoirApp.Application.Dtos
{
    public class CreatePlaylistDto
    {
        public string? Title { get; set; }
        public Guid ChoirId { get; set; }
        public bool IsPublic { get; set; }
        public DateTime Date { get; set; }
        public Guid? PlaylistTemplateId { get; set; }
        public List<PlaylistSectionDto> Sections { get; set; } = new List<PlaylistSectionDto>();
        public List<string> Tags { get; set; } = new List<string>();
    }
}
