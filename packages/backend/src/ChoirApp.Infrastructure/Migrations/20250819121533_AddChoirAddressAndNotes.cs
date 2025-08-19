using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChoirApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChoirAddressAndNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "address",
                table: "Choirs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "notes",
                table: "Choirs",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "address",
                table: "Choirs");

            migrationBuilder.DropColumn(
                name: "notes",
                table: "Choirs");
        }
    }
}
