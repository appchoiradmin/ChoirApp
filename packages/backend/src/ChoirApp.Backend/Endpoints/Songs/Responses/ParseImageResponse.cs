using System;

namespace ChoirApp.Backend.Endpoints.Songs.Responses
{
    public class ParseImageResponse
    {
        public string ChordProContent { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public DateTime ProcessedAt { get; set; }
    }
}
