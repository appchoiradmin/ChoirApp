using System;

namespace ChoirApp.Backend.Endpoints.Songs.Requests
{
    public class SearchSongsRequest
    {
        public string SearchTerm { get; set; } = string.Empty;
        public Guid? UserId { get; set; }
        public Guid? ChoirId { get; set; }
    }
}
