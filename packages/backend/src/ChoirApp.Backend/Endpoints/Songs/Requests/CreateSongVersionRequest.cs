using System;
using ChoirApp.Application.Dtos;

namespace ChoirApp.Backend.Endpoints.Songs.Requests
{
    public class CreateSongVersionRequest
    {
        public Guid BaseSongId { get; set; }
        public string Content { get; set; } = string.Empty;
        public SongVisibilityType Visibility { get; set; } = SongVisibilityType.Private;
    }
}
