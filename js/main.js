let url = window.location.pathname;

//-Animacija pri učitavanju stranice-
window.onload = function() {
    setTimeout(()=>{
        $("#loading").fadeOut(800, function(){
            $("#loading").remove();
        });
    }, 1200)
}

ajaxData("slider",displayHeader);
$('#search').keyup(filter);
$('#stock').change(filter);
$('#discounted').change(filter);
$('#shipping').change(filter);
$('#m').change(filter);

//-Dohvatanje podata-
function ajaxData(file, callback){
    let u;
    if(url=="/PlantPlanet/index.html"){
        u ="assets/data/";
    }else{
        u = "data/";
    }
    $.ajax({
        url: u + file + ".json",
        method: "get",
        dataType: "json",
        success: function(response){
            callback(response);
        },
        error: function(error){
            console.log(error);
        }
    })
}

//-Dohvatanje podataka iz LocalStorage-a-
function getLocalStorageItem(name){
    let item = localStorage.getItem(name);
    if(item){
        parsedItem = JSON.parse(item);
        if(parsedItem.length > 0){
            return parsedItem;
        }
    }
    return false;
}

//-Ispis headera(isto za svaku stramicu)-
function displayHeader(data){
    let html = "";
    html += `<div class="logo pt-3">
                <a href="../index.html"><i class="fab fa-pagelines"></i> Planet</a>
            </div>
            <nav class="pt-3 d-none d-md-block"><ul id="nav"></ul></nav>
            <ul class="pt-2" id="icons">
                <li><a href="#!"><i class="far fa-heart" id="w-sidebar"></i></a></li>
                <li><a href="#!"><i class="fas fa-shopping-cart" id="c-sidebar"></i></a></li>
                <li><a href="#!"><i class="fas fa-bars d-block d-md-none" id="hamburgercic"></i></a></li>
            </ul>`
    $('header').html(html);

    document.getElementById("w-sidebar").addEventListener("click", function(){
        let w = getLocalStorageItem("WishList");
        createSidebar(w?w:[
            
        ], "wish list");
    });
    document.getElementById("c-sidebar").addEventListener("click", function(){
        let c = getLocalStorageItem("cart");
        createSidebar(c, "cart");
    });

    try{
        ajaxData("nav", displayNav);
    }
    catch(c){
        console.log(`Error loading navigation! Status ${c}`);
        $("#nav").append("<li>Error loading navigation. Try again later.</li>");
    }

    displayFooter();

    if(url == "/PlantPlanet/index.html"){
        localStorage.setItem("slajder",JSON.stringify(data));
        changeSlide();
    }
    if(url != "/index.html"){
        if(getLocalStorageItem("slajder")){
            localStorage.removeItem("slajder");
        }
    }
}

//-Ispis footera(isto za svaku stranicu)-
function displayFooter(){
    let html = "";
    html += `<div class="container row mx-auto"> 
                <div class="col-12 col-md-4 mb-4">
                    <div class="logo">
                        <a href="../index.html"><i class="fab fa-pagelines"></i> Planet</a>
                    </div>
                    <p>~ Place of love for nature ~</p>
                </div>
                <div class="col-12 col-md-4 mb-4" id="link">
                    <h3>Useful links:</h3>
                </div>
                <div class="col-12 col-md-4 mb-4">
                    <h3>Author:</h3>
                    <p>Miljana Nerić 20/20</p>
                </div>
            </div>  
            <hr/> 
            <p id="me">&copy;Copyright <a href="https://miljana20.github.io/PORTFOLIO/" target="_blank">Nerić Miljana</a>. All Rights Reserved.</p>
            <button id="to-top" title="Scroll to top"><i class="fa fa-angle-up"></i></button>`
    $('footer').html(html);
    ajaxData("links", displayLinks);
    displayShipping();

    $('#to-top').click(function(){
        $('html ,body').animate({scrollTop : 0});
    });

}

//-Prikazivanje obavještenja za besplatnu dostavu na teritoriji Srbije-
function displayShipping(){
    let html = `<div class="o p-3">
                    <p class="h3">FREE SHIPPING in Serbia!</p>
                </div>`;
    $(".shipping").prepend(html);
} 

//-Prikaz linkova u footeru-
function displayLinks(data){
    html = "";
    for(d of data){
        html += `<p><a href="../${d.href}" target="_blank"><i class="${d.class}"></i> ${d.title}</a></p>`
    }
    $('#link').append(html);
}

//-Ispis kartica sa biljkama-
let page = 1;
function displayPlants(data){
    localStorage.setItem("Biljke", JSON.stringify(data));
    data = search(data);
    data = filterDurability(data);
    data = filterSpecies(data);
    data = filterHabitat(data);
    data = filterStock(data);
    data = filterDiscounted(data);
    data = filterShipping(data);
    data = filterMaxPrice(data);
    data = sort(data);

    let items;
    if(url == "/PlantPlanet/assets/shop.html"){
        items = Number($("#pagination").val());
    }
    else{
        items = 3;
    }

    pgination(data, items, page);
    
    page--;
    let start = items * page;
    let end = start + items;
    console.log(end);
    let pagData = data.slice(start, end);

    let html = '';
    if(pagData.length>0){
        for(let p of pagData){
            html +=`<div class="a col-11 col-md-5 col-xl-3 m-3 p-3 w-bg rounded" onclick="createCard(${p.id})" id="${p.id}">
                        ${getDis(p.price.discount)}
                        <img src="${url == "/PlantPlanet/index.html" ? "assets/" : ""}${getImg(p.img.src, 0)}" alt="${p.img.alt}"/>
                        <div class="p-3">
                            <h5>${p.name}</h5>
                            <p class="price h2">${p.price.new}$ <mark>${p.price.old ? p.price.old + "$" : ""}</mark></p>
                            <p class="text-danger">${p.stock ? "" : "No plant in stock!"}</p>
                            <p class="free">${p.freeShipping ? "Free shipping" : ""}</p>
                        </div>
                    </div>`
        }
    }
    else{
        html += `<div class="text-danger h2 bg rounded p-3 mt-5">Sorry, there are currently no products with selected features ...</div>`
    }
    if($('#display').length != 0){
        $('#display').html(html);
    }
    else if($('#disc-div').length != 0){
        $('#disc-div').append(html);
    }
}

//-Paginacija-
function pgination(datas, n, cPage){
    if($("#pagination-buttons").length != 0){
        $("#pagination-buttons").html("");
    }
    let nPage = Math.ceil(datas.length / n);
    for(let i = 1; i < nPage + 1; i++){
        let btn = paginationButtons(i);
        if($("#pagination-buttons").length != 0){
            $("#pagination-buttons").append(btn);
        }
    }
    function paginationButtons(cpage){
        let button = document.createElement("button");
        button.innerText = cpage;
        if(cPage == cpage) button.classList.add("active-pagination-button");
        button.addEventListener("click", function(){
            page = cpage;
            displayPlants(getLocalStorageItem("Biljke"));
        });
        return button;
    }
}

//-Ispis navigacije-
function displayNav(data){
    let html = "";
    for(const d of data){
        if(url == "/PlantPlanet/index.html"){
            if(d.title=="Home"){
                html += `<li><a href="${d.href}">${d.title}</a></li>`
            }
            else{
                html += `<li><a href="assets/${d.href}">${d.title}</a></li>`
            }
        }
        else{
            if(d.title=="Home"){
                html += `<li><a href="../${d.href}">${d.title}</a></li>`
            }
            else{
                html += `<li><a href="${d.href}">${d.title}</a></li>`
            }
        }
    }
    $("#nav").html(html);
    $("#mini-nav").html(html);

    //-Prikaz menija za manje rezolucije na klik ikonice-
    $('#hamburgercic').on('click', function(){
        if($('header').hasClass('header-bg') && $(window).scrollTop() < 80){
            $('header').removeClass('header-bg');
        }
        else{
            $('header').addClass('header-bg');
        }
        $('#mini-nav').toggle(1000, function(){
            $(window).scroll(function(){
                $('#mini-nav').hide(1000);
            });
        });
    });

    try {
        if(url == "/PlantPlanet/index.html"){
            filter();
        }
        ajaxData("durability", displayDurability);
    }
    catch(c){
        console.log(`Error loading products! Status ${c}`);
        $("#disc-div").append(`<p>Error loading products! Try again later.</p>`);
        $("#display").append(`<p>Error loading products and some categories! Try again later.</p>`);
    }

}

//-Ispis kategorija "durability"
function displayDurability(data){

    let html = "<h4 class='b'>Plant durability</h4>";
    for(const d of data){
        html += `<input type="checkbox" id="${d.value}" value="${d.id}" class="durability" name="durabilities"/>
                <label for="${d.value}"> ${d.label} plants</label>`
    }
    html += "<br/><br/>"
    $("#durability").html(html);
    if($("#durability").length!=0){
        $('#durability').change(filter);
    }
    ajaxData("species", displaySpecies);

    localStorage.setItem("Trajnosti", JSON.stringify(data));
}

//-Ispis kategorija "species"-
function displaySpecies(data){

    let html="<h4 class='b'>Plant species</h4>";
    for(let s of data){
        html+=`<input type="checkbox" id="${s.value}" value="${s.id}" class="species" name="speciess"/>
                <label for="${s.value}">Plant species of  ${s.value}</label>`
    }
    html += "<br/><br/>"
    $('#species').html(html);
    if($("#species").length!=0){
        $('#species').change(filter);
    }
    ajaxData("habitat", displayHabitat);

    localStorage.setItem("Vrste", JSON.stringify(data));
}

//-Ispis kategorija "habitat"-
function displayHabitat(data){

    let html="<h4 class='b'>Plant habitat</h4>";
    for(let h of data){
        html+=`<input type="checkbox" id="${h.value}" value="${h.id}" class="habitat" name="habitats"/>
                <label for="${h.value}">${h.label} land</label>`
    }
    html += "<br/><br/>"
    $('#habitat').html(html);
    if($("#habitat").length!=0){
        $('#habitat').change(filter);
    }
    if(url == "/PlantPlanet/assets/shop.html"){
        ajaxData("select", select);
    }

    localStorage.setItem("Stanista", JSON.stringify(data));
}

//-Ispis select-a za sortiranje i paginaciju-
function select(data){
    for(let d of data){
        let div = $("#"+d.for+"-div");
        let html =`<label for="${d.for}" class="label">${d.label}</label><br/>`;
        html += `<select id="${d.for}">`;
        for(let i=0; i<d.option.length; i++){
            html += `<option value="${d.option[i].value}">${d.option[i].title}</option>`;
        }
        html += `</select><br/><br/>`;
        div.html(html);
    }

    $("#sort").change(filter);
    $("#pagination").change(filter);
    ajaxData("plants", displayPlants);
}

//-Dohvatanje(ispis) popusta(ukoliko ga ima)-
function getDis(d){
    if(d != ""){
        html = "<div class='dis p-2'>"
        html += d + "% off";
        html +="</div>"
        return html;
    }
    return d;
}

//-Filter-
function filter(){
    page = 1;
    ajaxData("plants", displayPlants);
}

//-Pretraga naslova po ključnoj riječi-
function search(plants){
    if($('#search').length != 0){
        let word = $('#search').val().toLowerCase();
        let data  = plants.filter(p=> p.name.toLowerCase().indexOf(word) != -1);
        return data;
    }
    return plants;
}

//-Filtriranje proizvoda po trajnosti biljaka(durability)-
function filterDurability(plants){
    let durabilities = [];
    $('.durability:checked').each(function(e){
        durabilities.push(parseInt($(this).val()));
    });
    if(durabilities.length > 0) {
        return plants.filter(plant => durabilities.includes(plant.durability));
    }
    else return plants;
}

//-Filtriranje proizvoda po vrsti biljaka(species)-
function filterSpecies(plants){
    let spec = [];
    $('.species:checked').each(function(e){
        spec.push(parseInt($(this).val()));
    })
    if(spec.length>0){
        return plants.filter(plant => spec.includes(plant.species));
    }
    else return plants;
}

//-Filtriranje proizvoda po familijama biljaka(habitat)-
function filterHabitat(plants){
    let habitats = [];
    $('.habitat:checked').each(function(e){
        habitats.push(parseInt($(this).val()));
    })
    if(habitats.length>0){
        return plants.filter(h=> h.habitat.some(hab => habitats.includes(hab)))
    }
    else return plants;
}

//-Filtriranje po dostupnosti proizvoda-
function filterStock(plants){  
    if($('#stock:checked').length != 0){
        return plants.filter(plant => plant.stock == true)
    }
    else return plants;   
}

//-Filtriranje po besplatnoj dostavi proizvoda-
function filterShipping(plants){  
    if($('#shipping:checked').length != 0){
        return plants.filter(plant => plant.freeShipping == true)
    }
    else return plants;   
}

//-Filtriranje po dostupnosti proizvoda-
function filterDiscounted(plants){  
    if($('#discounted:checked').length != 0 || $('#disc-div').length != 0){
        return plants.filter(plant => plant.price.discount != "")
    }
    else return plants;   
}

//-Filtriranje po unijetoj maksimalnoj cijeni za proizvode-
function filterMaxPrice(plants){
    if($('#m').length != 0){
        let value = parseInt($("#m").val());
        return plants.filter(plant => plant.price.new <= value);
    }
    else return plants;
}

//-Sortiranje po cijeni proizvoda-
function sort(plants){
    if($("#sort").length != 0 || url=="/index.html"){
        let by = $('#sort').val();
        if(url=="/index.html"){by="discount"}
        switch(by){
            case "price-asc":{
                return plants.sort((a,b) => a.price.new - b.price.new);
            }
            case "price-desc":{
                return plants.sort((a,b) => b.price.new - a.price.new);
            }
            case "discount":{
                return plants.sort((a,b) => b.price.discount - a.price.discount);
            }
            case "name-asc":{
                return plants.sort(function(a,b){
                    if(a.name < b.name){
                        return -1;
                    }
                    else if(a.name > b.name){
                        return 1;
                    }
                    else return 0;
                });
            }
            case "name-desc":{
                return plants.sort(function(a,b){
                    if(a.name > b.name){
                        return -1;
                    }
                    else if(a.name < b.name){
                        return 1;
                    }
                    else return 0;
                });
            }
            default :{
                return plants;
            }
        }
        
    }
    return plants;
}

//-Kartice s detaljnijim opisom proizvoda-
function createCard(id){
    let pl = getLocalStorageItem("Biljke");
    let durability = getLocalStorageItem("Trajnosti");
    let species = getLocalStorageItem("Vrste");
    let html = "";
    for(let p of pl){
        if(p.id==id){
            html += `<div class="card-bg">
                        <div onclick="closeCard()" id="x"><i class="fas fa-times"></i></div>
                        <div class="crd rounded">
                            <div class="row justify-content-between p-1 p-sm-3 p-lg-5 w-100">
                                <div class="col-md-6 d-none d-md-block">
                                    <img src="${url == "/PlantPlanet/index.html" ? "assets/" : ""}${getImg(p.img.src, 1)}" alt="${p.img.alt}" class="w-75" id="big-one"/>
                                    <div class="row justify-content-between p-2 w-100">
                                        ${retrnMicroImgs(p.id)}
                                    </div>
                                </div>
                                <div class="col-12 col-md-6">
                                    <p class="h2 mb-3 brg">${p.name}</p>
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item"><mark class="bold">Durability: </mark>${getDS(p.durability, durability)}</li>
                                        <li class="list-group-item"><mark class="bold">Habitat: </mark>${getH(p.habitat)}</li>
                                        <li class="list-group-item"><mark class="bold">Plant species of </mark>${getDS(p.species, species)}</li>
                                        <li class="list-group-item"><mark class="bold">Discount: </mark>${p.price.discount ? p.price.discount + "%" : "No discount!"}</li>
                                    </ul>
                                    <hr/>
                                    <div>${onStock(p.id)}</div>
                                </div>
                            </div>
                        </div>
                    </div>`;
        }
    }
    $("body").append(html);
}

//-Zatvaranje kartice-
function closeCard(){
    document.querySelector(".card-bg").remove();
}

//-Ispis dijela kartice-
function onStock(id){
    let pl = getLocalStorageItem("Biljke");
    let html="";
    for(let p of pl){
        if(p.id==id){
            if(p.stock){
                html +=`<p class="price h2">${p.price.new}$ <mark class="line">${p.price.old ? p.price.old + "$" : ""}</mark></p>
                        <idv class="row w-100 justify-content-center">
                            <button id="add-to-cart" value="add" class="col-4 m-2" onclick="cart(${p.id})">Add to cart</button>
                            <input type="number" name="add" id="add-to-cart-value" min="1" value="1" class="col-3 m-2"/>
                            <div class="col-2 m-2 p-1" onclick="wishList(${p.id})"><i class="far fa-heart" id="heart-card"></i></div>
                        </idv>
                        <span id="dodato" class="p-3">Added to the cart!</span>`
            }
            else{
                html +=`<p class="text-danger p-2">No plant in stock!</p>`;
            }
        }
    }
    return html;
}

//-Dohvatanje lokacije slike iz niza lokacija-
function getImg(arr, id){
    for(let a of arr){
        if(arr.indexOf(a) == id){
            return a;
        }
    }
}

//-Dohvatanje ostalih slika pojedinog proizvoda-
function retrnMicroImgs(id){
    let pl = getLocalStorageItem("Biljke");
    let html = "";
    for(let p of pl){
        if(p.id==id){
            html +=`<div class="col-5 p-3" onclick="displayMicroImgs(${p.id}, 1)">
                        <img src="${url == "/PlantPlanet/index.html" ? "assets/" : ""}${getImg(p.img.src, 1)}" alt="${p.img.alt}"/>
                    </div>`
            if(p.img.src.length==3){
                html +=`<div class="col-5 p-3" onclick="displayMicroImgs(${p.id}, 2)">
                            <img src="${url == "/PlantPlanet/index.html" ? "assets/" : ""}${getImg(p.img.src, 2)}" alt="${p.img.alt}"/>
                        </div>`
            }
        }
    }
    return html;
}

//-Funkcija za pun prikaz na kliknutu sliku-
function displayMicroImgs(id, img){
    let pl = getLocalStorageItem("Biljke");
    for(let p of pl){
        if(p.id==id){
            document.getElementById("big-one").setAttribute("src", url == "/PlantPlanet/index.html" ? "assets/"+getImg(p.img.src, img) : getImg(p.img.src, img));
        }
    }
}

//-Dohvatanje kategorije trajnost(dutability) i vrsta(species) proizvoda-
function getDS(id, data){
    for(let d of data){
        if(d.id==id){
            return d.value;
        }
    }
}

//-Dohvatanje niza kategorije staništa(habitat)-
function getH(ids){
    let habitat = getLocalStorageItem("Stanista");
    let h="";
    for(let id of ids){
        for(let x of habitat){
            if(id==x.id){
                h+=x.value + " land, ";
            }
        }
    }
    return h.substring(0, h.length-2);
}

//-Kreiranje za listu Želja i korpu-
function createSidebar(array, type){
    let html = `<div class="sidebar">
                    <div class="row justify-content-center text-center p-3">
                        <p class="h2 col-10">Your ${type}</p>
                        <div onclick="closeSidebar()" class="col-2"><i class="fas fa-times"></i></div>
                    </div>
                    <div class="p-3 w-100 row justify-content-center" id="sidebar-content">`;
    let pl = getLocalStorageItem("Biljke");
    if(array && array.length > 0){
        for(let p of pl){
            for(i of array){
                if(type == "cart" ? p.id==i.id : p.id==i){
                    html +=`<div class="w col-8 col-md-4 m-3 p-3 w-bg">
                                <img src="${url == "/PlantPlanet/index.html" ? "assets/" : ""}${getImg(p.img.src, 0)}" alt="${p.img.alt}"/>
                                <div class="p-3">
                                    <h5>${p.name}</h5>
                                    <p class="price h2">${p.price.new}$ <mark>${p.price.old ? p.price.old + "$" : ""}</mark></p>
                                    <p class="text-danger">${p.stock ? "" : "No plant in stock!"}</p>
                                    <p class="free">Quantitiy: ${i.value ? i.value : ""}</p>
                                    <p class="free h" onclick="rem${type == "cart"?"c":"w"}(${p.id})">Remove ${type == "cart"?"":"<i class='fas fa-heart-broken'></i>"}</p>
                                </div>
                            </div>`
                }
            }
        }
        if(type == "cart"){
            html+= `<div  class="row justify-content-center">
                        <input type="button" onclick="orderForm()" value="Order" class="button rounded p-2 m-md-3 m-2 col-5 col-md-3"/>
                        <input type="button" onclick="del('cart')" value="Clear" class="button rounded p-2 m-md-3 m-2 col-5 col-md-3"/>
                        <p><span class="h3">Total price: ${total()} $ </span>(With shipping per product)</p>
                    </div>`
        }
        else {
            html+= `<div class="row justify-content-center">
                        <input type="button" onclick="del('WishList')" value="Clear" class="button rounded p-2 m-md-3 m-2 w-50"/>
                    </div>`
        }
    }
    else {
        html += `<p class="mt-5">Your ${type} is empty!<br/>Visit our <a href="${url == "/PlantPlanet/index.html" ? "assets/" : ""}shop.html">shop</a> to add new items.</p>`;
    }
    html += "</div></div>"
    $("main").append(html);
}

//-Računanje totalne cijene
function total(){
    let total = 0.;
    let pl = getLocalStorageItem("Biljke");
    let cartt = getLocalStorageItem("cart");
    for(p of pl){
        for(c of cartt){
            if(c.id == p.id){
                total += c.value * p.price.new;
                if(!p.freeShipping){total += 1;}
            }
        }
    } 
    return total;
}

//-Brisanje pojedinačnof proizvoda iz korpe-
function remc(id){
    let niz = getLocalStorageItem("cart");
    for(let i = 0; i < niz.length; i++){
        if(niz[i].id == id){
            niz.splice(i, 1);
            localStorage.setItem("cart", JSON.stringify(niz));
            closeSidebar();
            createSidebar(niz,"cart");
        }
    }
}

//-Brisanje pojedinačnof proizvoda sa liste želja 
function remw(id){
    let niz = getLocalStorageItem("WishList");
    for(let i = 0; i < niz.length; i++){
        if(niz[i] == id){
            niz.splice(i, 1);
            localStorage.setItem("WishList", JSON.stringify(niz));
            closeSidebar();
            createSidebar(niz,"Wish List");
        }
    }
}

//-Zatvaranje Sidebar-a-
function closeSidebar(){
    document.querySelector(".sidebar").remove();
}

//_Uklanjanje sveukupnog odabira liste želja i korpe
function del(x){
    localStorage.removeItem(x);
    location.reload();
}

//-Ispis forme za narudžbinu-
function orderForm(){
    let html = `<form action="" class="w-75">
                    <input type="text" id="nameO" name="nameO" placeholder="Your full name" class="form-control rounded p-2 m-md-3 mb-2"/>
                    <input type="email" id="emailO" name="emailO" placeholder="Your email" class="form-control rounded p-2 m-md-3 mb-2"/>
                    <div class="form-control rounded p-2 m-md-3 mb-2">
                        <input type="radio" name="locc" value"0"/>Delivery location not in Serbia<br/>
                        <input type="radio" name="locc" value="1"/>Delivery location in Serbia
                    </div>
                    <p id="loc-p"></p>
                    <input type="button" id="btnOrder" value="order" class="button rounded"/>
                </form>`;
    $("#sidebar-content").html(html);
    $("#btnOrder").on("click",orderValidation);
}

//-Dodavamje proizvoda na listu želja-
function wishList(id){
    let x = document.getElementById("heart-card");
    x.classList.remove("far");
    x.classList.add("fas");

    var w = getLocalStorageItem("WishList");
    if(!w){
        w=[];
        w[0] = id;
        localStorage.setItem("WishList", JSON.stringify(w));
    }
    else{
        let j = 0;
        for(let i of w){
            if(i==id){j++};
        }
        if(j==0){w[w.length]=id}
        localStorage.setItem("WishList", JSON.stringify(w));
    }
}

//-Dodavanje u korpu-
function cart(id){
    $('#dodato').fadeIn(500, function(){
        setTimeout(()=>{$('#dodato').fadeOut(500)},2000);
    });
    var ids = getLocalStorageItem("cart");
    if(!ids){
        ids=[];
        ids[0] = {"id":id,
                    "value":Number(document.getElementById("add-to-cart-value").value)}
        localStorage.setItem("cart", JSON.stringify(ids));
    }
    else{
        var n = 0;
        for(let i of ids){
            if(i.id==id){
                i.value +=Number(document.getElementById("add-to-cart-value").value);
                n++;
            }
        }
        if(n==0){
            ids[ids.length] = {"id":id,
                                "value":Number(document.getElementById("add-to-cart-value").value)}
        }
        localStorage.setItem("cart", JSON.stringify(ids));
    }
}
//-Animacija header-a i prikaz dugmeta "To top" na skrol na stranici-
$(window).scroll(function(){
    if($(this).scrollTop() > 80){
        $('#to-top').fadeIn();
        $('header').addClass('header-bg');
    }
    else{
        $('#to-top').fadeOut();
        $('header').removeClass('header-bg');
    }
});

//-Prikaz više informacija o autoru-
$('#miljana-more').on('click', function(){
    $('#miljana').toggle(2000);
});

//-Slajder-
var position = 0;
function changeSlide(){
    sl = getLocalStorageItem("slajder");
    document.querySelector("#slider").style.backgroundImage = sl[position].img.src;
    if(position < sl.length - 1){
        position++;
    }else{
        position = 0;
    }
    setTimeout("changeSlide()", 4000);
}

//-Validaija formi-
if(url == "/PlantPlanet/assets/contact.html"){
    document.querySelector("#btnSubmit").addEventListener("click", messageValidation);
}

var nRegex = /^\p{Uppercase_Letter}\p{Letter}{1,14}(\s\p{Uppercase_Letter}\p{Letter}{1,14}){1,3}$/u;
var eRegex = /^[a-z]((\.|-|_)?[a-z0-9]){2,}@[a-z]((\.|-)?[a-z0-9]+){2,}\.[a-z]{2,6}$/i;
var sRegex = /^\p{Uppercase_Letter}[\p{Letter}\.,\?!\/-]*(\s[\p{Letter}\.,\?!\/-]+)*$/u;
var mRegex = /.{20,}/;

var fullNameMessage = "All words must begin with a capital letter."
var emailMessage = "Use only letters, numbers and symbols @.-_"

function validation(regex, input, val, n, m){
    var err = 0;
    if(!regex.test(val)){
        input.classList.add("err");
        if(val.length == 0){
            input.setAttribute("placeholder", "You must fill in the field.");
        }
        else if(val.length > n){
            input.setAttribute("placeholder", "Length of the "+input.id+" must be less than "+n+".");
        }
        else{
            input.setAttribute("placeholder", m);
        }
        input.value = "";
        err++;
    }
    else{
        input.style.border = "1px solid #aaa";
        input.classList.remove("err");
    }
    return err;
}

function messageValidation(){
    var name = document.querySelector("#name");
    var email = document.querySelector("#email");
    var subject = document.querySelector("#subject");
    var message = document.querySelector("#message");

    var err = 0;
    err += validation(nRegex, name, name.value, 30, fullNameMessage);
    err += validation(eRegex, email, email.value, 50, emailMessage);
    err += validation(sRegex, subject, subject.value, 30, "First letter must be a capital. You can use symbols .,-/?!");
    err += validation(mRegex, message, message.value, 200, "Message must be at least 20 and less then 200 characters long.");

    if(!err){
        al(name.value, "message", 0);
    }
}

function orderValidation(){
    var name = document.querySelector("#nameO");
    var email = document.querySelector("#emailO");
    var loc = document.querySelector('input[name="locc"]:checked');

    var err = 0;
    var x =0.
    err += validation(nRegex, name, name.value, 30, fullNameMessage);
    err += validation(eRegex, email, email.value, 50, emailMessage);
    if(loc == null){
        $("#loc-p").html("**Pleace, chose location.");
        err++;
    }
    if(!loc.value){
        x = 4.99;
        $("#loc-p").html("")
    }

    if(!err){
        al(name.value, "order", x);
    }
}

function tott(x){
    let xx;
    xx = total();
    xx += x;
    return xx;
}

function al(name, type, x){
    alert(`Dear ${name}, your ${type} has been sent.${type=="order"?"Your total order costs "+tott(x)+" $":""} We will contact you as soon as posible.`);
    if(type == "order"){
        localStorage.clear();
    }
    location.reload();
}
