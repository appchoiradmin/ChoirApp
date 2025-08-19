using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ChoirApp.Backend.Endpoints.Songs.Requests
{
    public class UpdateSongRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Artist { get; set; }
        public string Content { get; set; } = string.Empty;
        [Url(ErrorMessage = "AudioUrl must be a valid URL")]
        public string? AudioUrl { get; set; }
        public List<string>? Tags { get; set; }
    }
}
