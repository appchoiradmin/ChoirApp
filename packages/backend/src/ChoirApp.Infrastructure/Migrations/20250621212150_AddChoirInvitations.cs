using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChoirApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChoirInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChoirInvitations",
                columns: table => new
                {
                    invitation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    choir_id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    invitation_token = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    date_sent = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChoirInvitations", x => x.invitation_id);
                    table.ForeignKey(
                        name: "FK_ChoirInvitations_Choirs_choir_id",
                        column: x => x.choir_id,
                        principalTable: "Choirs",
                        principalColumn: "choir_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChoirInvitations_choir_id",
                table: "ChoirInvitations",
                column: "choir_id");

            migrationBuilder.CreateIndex(
                name: "IX_ChoirInvitations_invitation_token",
                table: "ChoirInvitations",
                column: "invitation_token",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChoirInvitations");
        }
    }
}
