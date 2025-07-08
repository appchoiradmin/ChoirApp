using System;
using System.Collections.Generic;

namespace ChoirApp.Application.Dtos
{
    public class UpdatePlaylistDto
    {
        public string? Title { get; set; }
        public bool? IsPublic { get; set; }
        public List<string>? Tags { get; set; }
        public List<PlaylistSectionDto> Sections { get; set; } = new List<PlaylistSectionDto>();
    }
}
