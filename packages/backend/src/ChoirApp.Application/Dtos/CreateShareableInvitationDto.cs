using System;
using System.ComponentModel.DataAnnotations;

namespace ChoirApp.Application.Dtos
{
    public class CreateShareableInvitationDto
    {
        [Required]
        public Guid ChoirId { get; set; }

        public DateTime? ExpiryDate { get; set; }

        public int? MaxUses { get; set; }
    }
}
