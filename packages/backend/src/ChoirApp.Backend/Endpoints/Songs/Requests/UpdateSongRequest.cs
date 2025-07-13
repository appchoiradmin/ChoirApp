using System;

namespace ChoirApp.Backend.Endpoints.Songs.Requests
{
    public class UpdateSongRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Artist { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
