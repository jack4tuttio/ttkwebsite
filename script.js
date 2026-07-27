async function loadUsers(){

    let file = await fetch("flagged.txt");
    let ids = await file.text();

    ids = ids.split("\n").filter(x => x.trim() !== "");


    for(let id of ids){

        let user = await fetch(
        `https://users.roblox.com/v1/users/${id}`
        );

        let data = await user.json();


        let avatar = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png`
        );

        let avatarData = await avatar.json();


        let img = avatarData.data[0].imageUrl;


        document.getElementById("users").innerHTML += `

        <div class="card">

            <img src="${img}">

            <h2>${data.displayName}</h2>

            <p>@${data.name}</p>

            ${
            data.hasVerifiedBadge 
            ? "<span>✔ Verified</span>" 
            : ""
            }

            <p>ID: ${id}</p>

        </div>

        `;

    }

}


loadUsers();
