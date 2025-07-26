using System;
using System.Collections.Generic;
using ChoirApp.Domain.Entities;

namespace ChoirApp.Backend.Endpoints.Songs.Requests
{
    public class SearchSongsRequest
    {
        public string SearchTerm { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? Artist { get; set; }
        public string? Content { get; set; }
        public List<string>? Tags { get; set; }
        public Guid? UserId { get; set; }
        public Guid? ChoirId { get; set; }
        public SongVisibilityType? Visibility { get; set; }
        public int? Skip { get; set; }
        public int? Take { get; set; }
    }
}
