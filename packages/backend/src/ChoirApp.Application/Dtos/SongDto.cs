using System;
using System.Collections.Generic;

namespace ChoirApp.Application.Dtos
{
    public enum SongVisibilityType
    {
        Private,
        PublicAll,
        PublicChoirs
    }

    public class SongDto
    {
        public Guid SongId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Artist { get; set; }
        public string Content { get; set; } = string.Empty;
        public Guid CreatorId { get; set; }
        public string CreatorName { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
        public int VersionNumber { get; set; }
        public Guid? BaseSongId { get; set; }
        public SongVisibilityType Visibility { get; set; }
        public List<ChoirDto> VisibleToChoirs { get; set; } = new List<ChoirDto>();
        public List<TagDto> Tags { get; set; } = new List<TagDto>();
    }
}
