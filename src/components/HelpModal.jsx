import { useState } from "react";

const FAQ = [
    {
        q: "Qu'est-ce qu'un fichier CSV ?",
        a: "C'est un fichier texte contenant la liste de vos élèves, exporté depuis ONDE (Base élèves). Il s'ouvre avec Excel ou LibreOffice Calc, mais VigiAppel le lit directement.",
    },
    {
        q: "Où trouver le fichier CSV dans ONDE ?",
        a: "ONDE → Exports → Liste des élèves → Exporter en CSV. Sélectionner les colonnes : Classe, Enseignant(s), Nom, Prénom, Né(e) le, Sexe, Niveau.",
    },
    {
        q: "Mes données sont-elles envoyées sur internet ?",
        a: "Non. Tout le traitement se fait dans votre navigateur. Aucune donnée n'est transmise à un serveur. L'application est conforme RGPD.",
    },
    {
        q: "Qu'est-ce qu'une zone de mise en sûreté ?",
        a: "C'est l'endroit où les élèves et adultes se regroupent en cas de PPMS : gymnase, salle polyvalente, couloir condamnable... Votre école peut en avoir une seule ou plusieurs selon le bâti.",
    },
    {
        q: "Qu'est-ce que la cellule de crise ?",
        a: "C'est le poste de commandement du/de la directeur/trice pendant le PPMS. Il/elle communique avec les secours (SAMU 15, Police 17, Pompiers 18 ou 112), l'IEN et la mairie. Le directeur ne doit pas gérer une classe en même temps.",
    },
    {
        q: "Quelle est la différence entre absent, manquant et blessé ?",
        a: "Absent : élève non venu à l'école ce jour-là. Manquant : élève présent en début de journée mais introuvable lors du confinement. Blessé : présent mais nécessitant une prise en charge médicale.",
    },
    {
        q: "Que faire une fois les fichiers téléchargés ?",
        a: "Imprimer chaque fichier et le glisser dans la mallette PPMS de la zone correspondante. Les fiches sont prêtes à l'emploi : la date est laissée vierge pour être complétée le jour J.",
    },
    {
        q: "Comment mettre à jour les fiches en cours d'année ?",
        a: "Re-générez simplement les fiches avec le nouveau CSV. Seuls les fichiers des classes concernées par le changement sont à réimprimer.",
    },
];

export function HelpModal({ onClose }) {
    const [openIdx, setOpenIdx] = useState(null);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                {/* En-tête */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">❓</span>
                        <h2 className="text-base font-semibold text-gray-800">
                            Aide — Questions fréquentes
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                        aria-label="Fermer l'aide"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Contenu scrollable */}
                <div className="overflow-y-auto px-6 py-4 space-y-2">
                    {FAQ.map((item, i) => (
                        <div
                            key={i}
                            className="border border-gray-200 rounded-xl overflow-hidden"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenIdx(openIdx === i ? null : i)
                                }
                                className="w-full flex items-center justify-between px-4 py-3 text-left gap-3 hover:bg-gray-50 transition-colors"
                            >
                                <span className="text-sm font-medium text-gray-800">
                                    {item.q}
                                </span>
                                <svg
                                    className={`w-4 h-4 shrink-0 transition-transform text-gray-400 ${openIdx === i ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>
                            {openIdx === i && (
                                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50">
                                    <p className="pt-3">{item.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Pied */}
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0">
                    <p className="text-xs text-gray-400 text-center">
                        VigiAppel — basé sur le modèle Eduscol PPMS, fascicule
                        2, février 2024 ·{" "}
                        <a
                            href="https://micetf.fr"
                            target="_blank"
                            rel="noreferrer"
                            className="underline hover:text-gray-600"
                        >
                            micetf.fr
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
