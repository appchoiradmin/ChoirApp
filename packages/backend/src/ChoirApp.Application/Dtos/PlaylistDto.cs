using System;
using System.Collections.Generic;

namespace ChoirApp.Application.Dtos
{
    public class PlaylistDto
    {
        public Guid Id { get; set; }
        public string? Title { get; set; }
        public bool IsPublic { get; set; }
        public Guid ChoirId { get; set; }
        public DateTime Date { get; set; }
        public Guid? PlaylistTemplateId { get; set; }
        public List<PlaylistSectionDto> Sections { get; set; } = new List<PlaylistSectionDto>();
        public List<string> Tags { get; set; } = new List<string>();
    }

    public class PlaylistSectionDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Order { get; set; }
        public List<PlaylistSongDto> Songs { get; set; } = new List<PlaylistSongDto>();
    }

    public class PlaylistSongDto
    {
        public Guid Id { get; set; }
        public int Order { get; set; }
        public Guid? MasterSongId { get; set; }
        public Guid? ChoirSongVersionId { get; set; }
    }
}
