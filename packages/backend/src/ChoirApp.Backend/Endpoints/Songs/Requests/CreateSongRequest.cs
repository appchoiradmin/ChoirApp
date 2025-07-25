using System;
using System.Collections.Generic;
using ChoirApp.Application.Dtos;

namespace ChoirApp.Backend.Endpoints.Songs.Requests
{
    public class CreateSongRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Artist { get; set; }
        public string Content { get; set; } = string.Empty;
        public SongVisibilityType Visibility { get; set; } = SongVisibilityType.Private;
        public List<Guid>? VisibleToChoirs { get; set; }
    }
}
