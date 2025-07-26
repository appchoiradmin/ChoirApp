using System;
using System.Collections.Generic;

namespace ChoirApp.Backend.Endpoints.Songs.Requests
{
    public class UpdateSongRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Artist { get; set; }
        public string Content { get; set; } = string.Empty;
        public List<string>? Tags { get; set; }
    }
}
